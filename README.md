# DEDaemon

DEDaemon is a daemon to give some of the perks of a full desktop environment to
those of us running window managers.

## Installation

Run `npm install -g dedaemon` as root.

## Usage

```
dedaemon <config file> -- Start a new instance of dedaemon
dedaemon stop          -- Stop all running istances of dedaemon
dedaemon reload        -- Reload config file
```

e.g:

`dedaemon ~/.config/dedaemon.hcnf`

You probably want to run that on startup. If you're running i3wm, that means
adding `exec --no-startup-id dedaemon stop; dedaemon~/.config/dedaemon.hcnf` to
`~/.i3/config`. This first stop any running instance of dedaemon, then runs a
new one.

## Configuration

There will be stuff here later.
