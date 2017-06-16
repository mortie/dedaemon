# DEDaemon

DEDaemon is a daemon to give some of the perks of a full desktop environment to
those of us running window managers.

## Installation

Run `npm install -g dedaemon` as root.

## Usage

```
dedaemon <config file> -- Start a new instance of dedaemon
dedaemon list          -- List all displays and input devices
dedaemon stop          -- Stop all running istances of dedaemon
dedaemon reload        -- Reload config file
```

e.g:

`dedaemon ~/.config/dedaemon.hcnf`

You probably want to run that on startup. If you're running i3wm, that means
adding `exec --no-startup-id dedaemon stop; dedaemon ~/.config/dedaemon.hcnf` to
`~/.i3/config`. This first stop any running instance of dedaemon, then runs a
new one.

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

## Configuration

Dedaemon uses [my hconfig library](https://github.com/mortie/hconfig#syntax)
to parse the config file. Refer to that page if you need help with the syntax.

The file
[example.hcnf](https://git.mort.coffee/mort/dedaemon/src/master/example.hcnf)
contains some example configuration.

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
