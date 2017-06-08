#include "json.h"
#include <libudev.h>
#include <stdio.h>
#include <sys/select.h>
#include <unistd.h>
#include <errno.h>
#include <string.h>
#include <fcntl.h>
#include <stdlib.h>

struct udev *udev;

FILE *out;

struct listener
{
	struct udev_monitor *mon;
	int fd;
};

struct listener listeners[32];
int listenerc = 0;

struct udev_monitor *mons[32];

static void devinfo_print_json(
		FILE *f,
		struct udev *udev,
		struct udev_device *dev)
{
	struct udev_list_entry *entry, *sysattrs;
	int first;
	const char *key, *val;

	json_obj_start(f);

	sysattrs = udev_device_get_properties_list_entry(dev);
	first = 1;
	udev_list_entry_foreach(entry, sysattrs)
	{
		key = udev_list_entry_get_name(entry);
		val = udev_list_entry_get_value(entry);

		if (!first)
			json_sep(f);
		json_obj_key(f, key);
		json_str(f, val);

		first = 0;
	}

	json_obj_end(f);

	udev_device_unref(dev);
}

static void enumerate(FILE *f, const char *subsystem)
{
	struct udev_enumerate *en;
	struct udev_list_entry *device, *devices;
	struct udev_device *dev;
	int first;
	const char *name;

	// Create enumerator
	en = udev_enumerate_new(udev);
	if (subsystem != NULL)
		udev_enumerate_add_match_subsystem(en, subsystem);

	json_arr_start(f);

	// Enumerate
	udev_enumerate_scan_devices(en);
	devices = udev_enumerate_get_list_entry(en);
	first = 1;
	udev_list_entry_foreach(device, devices)
	{
		if (!first)
			json_sep(f);

		name = udev_list_entry_get_name(device);
		dev = udev_device_new_from_syspath(udev, name);
		devinfo_print_json(f, udev, dev);

		first = 0;
	}

	json_arr_end(f);

	printf("\n");
	fflush(f);

	udev_enumerate_unref(en);
}

int monitor(const char *subsystem)
{
	struct udev_monitor *mon;
	struct listener *l;

	mon = udev_monitor_new_from_netlink(udev, "udev");
	if (!mon)
		return -1;

	if (subsystem != NULL)
	{
		udev_monitor_filter_add_match_subsystem_devtype(
			mon, subsystem, NULL);
	}
	udev_monitor_enable_receiving(mon);

	l = &listeners[listenerc++];
	l->mon = mon;
	l->fd = udev_monitor_get_fd(mon);

	return 0;
}

void oncommand(struct listener *l)
{
	char buf[1024];
	char *cmd, *arg;
	int cnt, i;
	char c;

	memset(buf, 0, sizeof(buf));

	cnt = read(l->fd, buf, sizeof(buf));
	if (cnt == -1)
	{
		perror("stdin");
		return;
	}
	else if (cnt == 0)
	{
		// don't try to read from stdin anymore if it's closed
		l->fd = -1;
		return;
	}
	else if (cnt == sizeof(buf))
	{
		fprintf(stderr, "input buffer too big\n");

		// drain, so we don't end up reading stale data next time
		do {
			cnt = read(l->fd, buf, sizeof(buf));
			if (cnt == -1)
			{
				perror("stdin");
				return;
			}
		} while (cnt == sizeof(buf));
		return;
	}

	// parse input into command and argument
	cmd = buf;
	arg = NULL;
	i = 0;
	while (1)
	{
		c = buf[i];

		// colon: replace with \0 to terminate cmd,
		// update arg to point to the charcater after :
		if (c == ':')
		{
			buf[i] = '\0';
			arg = buf + i + 1;
		}

		// newline: replace with \0 to terminate arg,
		// respond to request, then update cmd and
		// continue reading the buffer until we reach a \0
		else if (c == '\n' || c == '\0')
		{
			buf[i] = '\0';

			if (*cmd == '\0')
				break;

			// respond to request
			if (strcmp(cmd, "list") == 0)
			{
				if (strcmp(arg, "*") == 0)
					enumerate(out, NULL);
				else
					enumerate(out, arg);
			}
			else if (strcmp(cmd, "monitor") == 0)
			{
				if (strcmp(arg, "*") == 0)
					monitor(NULL);
				else
					monitor(arg);
			}
			else
			{
				fprintf(stderr, "Unknown command: %s\n", cmd);
			}

			if (c == '\0')
				break;

			cmd = buf + i + 1;
		}

		i += 1;
	}
}

void onevent(struct listener *l)
{
	struct udev_device *dev = udev_monitor_receive_device(l->mon);
	if (!dev)
	{
		fprintf(stderr, "No device even though an event occurred.\n");
		return;
	}

	devinfo_print_json(out, udev, dev);
	printf("\n");
	fflush(out);
}

void readinput()
{
	fd_set set;
	FD_ZERO(&set);
	int max = -1;
	for (int i = 0; i < listenerc; ++i)
	{
		int fd = listeners[i].fd;
		if (fd == -1)
			continue;
		FD_SET(fd, &set);
		if (fd > max)
			max = fd;
	}

	int activity;

	activity = select(max + 1, &set, NULL, NULL, NULL);
	if (activity < 0)
	{
		if (errno != EINTR)
			perror("select");
		return;
	}

	for (int i = 0; i < listenerc; ++i)
	{
		struct listener *l = &listeners[i];
		int fd = l->fd;
		if (!FD_ISSET(fd, &set))
			continue;

		if (fd == STDIN_FILENO)
			oncommand(l);
		else
			onevent(l);
	}
}

int main()
{
	out = stdout;
	memset(listeners, 0, sizeof(listeners));

	// read stdin
	listeners[listenerc++].fd = STDIN_FILENO;

	// create udev
	udev = udev_new();
	if (!udev)
	{
		fprintf(stderr, "Failed to craete udev\n");
		return 1;
	}

	// main loop
	while (1) {
		readinput();
	}

	udev_unref(udev);
}
