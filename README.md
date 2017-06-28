# DEDaemon

DEDaemon is a daemon to give some of the perks of a full desktop environment to
those of us running window managers.

<!-- toc -->

- [Usage](#usage)
- [Installing](#installing)
- [Why?](#why)
  * [Why node.js?](#why-nodejs)
- [Configuration](#configuration)
  * [General](#general)
  * [Display](#display)
  * [Input](#input)
  * [Wallpaper](#wallpaper)
  * [Process](#process)

<!-- tocstop -->

## Usage

```
dedaemon <config file> -- Start a new instance of dedaemon
dedaemon list          -- List all displays and input devices
dedaemon stop          -- Stop all running istances of dedaemon
dedaemon reload        -- Reload config file
```

e.g:

`dedaemon ~/.config/dedaemon.hcnf`

You'll probably want to run that on startup. If you're running i3wm, that means
adding `exec --no-startup-id dedaemon stop; dedaemon ~/.config/dedaemon.hcnf` to
`~/.i3/config`. This will first stop any running instance of dedaemon, then run a
new one.

## Installing

**First install libudev development headers if necessary:**

```
sudo apt install libudev-dev
```

**If you already have a recent node.js and npm set up:**

```
sudo npm install -g --unsafe-perm dedaemon
```

**If you don't have a recent version of node.js:** (replace apt with your
package manager of choice)

```
sudo apt install npm
sudo npm install -g n
sudo n stable
sudo npm install -g --unsafe-perm dedaemon
```

Here, we first install npm, node's package manager. We then use that to install
`n`, which is a handy tool to install node. We use `n` to install the
current stable version of node, and then finally install dedaemon with npm.

You might also be able to use your package manager's version of node, but some
distros (**cough**debian**cough**) ship _really_ old versions.

**The reason --unsafe-perm is required** is that during installation, I compile
the C code in the `udev/` directory, which interfaces with libudev, with a
postinstall script. After NPM 5, postinstall scripts don't have write access to
the directory the package is installed to. If you don't feel comfortable with
running with `--unsafe-perm`, you can clone this repository, and run
`npm run postinstall; sudo npm install -g` manually from within the directory.

## Why?

I love using i3wm, but that means I'm running just a window manager, not a
desktop environment. A desktop environment usually handles a lot of stuff, like
automatically applying your preferences to keyboard and mice, adapting to
displays being plugged in or unplugged, and setting your wallpaper and making
sure it continues to look okay when your displays change. The common solution
is to have a shell script which you run at startup, which runs the commands to
configure input devices, start applications, etc. The problem with that is that
it adapts poorly to changes to the system after the script has started.

I made dedaemon to give me some of the perks of a desktop environment, without
actually running a complete desktop environment. Whenever a display is
connected or disconnected, it runs the required xrandr commands to set up your
displays like you want them, then runs the required feh command to set your
wallpaper again. Whenever an input device is connected, it applies your desired
xinput settings to the device, and re-runs whatever commands you desire
(e.g xset, setxkbmap). It runs the applications and services you want to run on
startup, and makes sure they are properly termminated when dedaemon stops.

### Why node.js?

I suspect a lot of people will wonder why on earth this is written in
javascript and using node.js. The simple reason is that I like it. Newer
versions of javascript has pretty nice syntax, and node.js is really quite good
at asynchronous programming; a lot of what dedaemon does is sitting idle and
waiting for events, and interacting with the system. It's nice to not block
while running relatively slow xrandr commands. I also find node's interface for
spawning and interacting with child processes to be really nice.

A lot of why people dislike node.js is dependency hell; any package has a dozen
dependencies, each of which in turn has a dozen more sub-dependencies, etc. I
personally don't like that either. That's why dedaemon has exactly one
dependency, counting transient dependencies, and that's my config file parser.
At the time of writing, the entire thing is around 300 kilobytes, and that's
counting the `node_modules` folder and everything. 

Even the code interacting with udev doesn't use the "proper" way of integrating
C code with node, because that requires dependencies, and you suddenly end up
with a hundred transient dependencies. Instead, I just wrote a tiny C program
which I interact with by writing to its stdin and reading from its stdout.

## Configuration

Dedaemon uses [my hconfig library](https://github.com/mortie/hconfig#syntax)
to parse the config file. Refer to that page if you need help with the syntax.

The file
[example.hcnf](https://git.mort.coffee/mort/dedaemon/src/master/example.hcnf)
contains some example configuration.

For a bigger and possibly more realistic config file, here's the one I
personally use for my machines:
https://github.com/mortie/nixConf/blob/master/.dedaemon.hcnf

### General

The `general` section is for configuration of dedaemon itself; the only
property so far is `log`.

```
general {
	log <log file>
}
```

### Display

The `display` section controls a display. Refer to `dedaemon list` or `xrandr`
to see what values are available. The `name` property can be `*` to affect all
displays.

Later configurations override previous configurations; if you have one
configuration for `*` (meaning it applies to all displays), followed by one
for `HDMI1`, only the `HDMI1` configuration will be applied to displays
connected to the HDMI1 port. If you have one configuration for `HDMI1`,
followed by one for `*`, only the `*` configuration will be applied to displays
connected to HDMI1.

```
display <name> {
	mode <string | "max">
	rate <number | "max">
	where {
		<left-of | right-of | above | below> <name | "primary">
	}
}
```

### Input

The `input` section controls an input device. Refer to `dedaemon list` or
`xinput list` to see a list of devices. The `name` property can be `*` to
affect all input devices.

In contrast with `display`, all matching configurations will be applied to an
input device. If you have one section named `*`, and one named say
`Logitech HID compliant keyboard`, both with `type keyboard`, the settings for
both `*` and for `Logitech HID compliant keyboard` will be applied to the
device.

```
input <name> {
	type <"pointer" | "keyboard"> - Apply only to pointer or keyboard devices
	options <array of arrays>     - Options passed to `xinput set-prop`
	commands <array of strings>   - Commands to run when the device is connected
}
```

### Wallpaper

The `wallpaper` section controlls the wallpaper.

```
wallpaper {
	path <background image file>
	mode <"scale" | "center" | "fill" | "max" | "tile">
}
```

### Process

The `process` section describes processes you want to run whenever dedaemon
starts.

```
process <name> {
	run <array of strings> -- Command
	as (process|group)     -- Run a single command or an array or commands
	in <directory>         -- Working directory
	env <object>           -- Environment variables
	delay <number>         -- Number of milliseconds to wait before executing
}
```

You can also run multiple commands in the same section, by adding `as group`,
like this:

```
process misc {
	run [
		[ firefox ]
		[ sh .startup.sh ]
	] as group
}
```
