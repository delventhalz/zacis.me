# zacis.me

This is the source code for my portfolio site, [zacis.me](https://zacis.me).
It is built with HTML, CSS, and JavaScript, [Preact](https://preactjs.com/) for
the dynamic project gallery and [html2canvas](https://html2canvas.hertzen.com/)
for the mirror effect. That's about it. There is no build step. The files in
[public/](./public) are served as is.

Why so simple?

Every new tool you add to a project introduces new complexity. This is true of
all code of course. Unneeded elements, whether ours or someone else's,
constantly threaten to corrupt formerly pristine projects. So even though on a
large team I am often the strongest advocate for sophisticated frameworks,
strict types and testing, and robust build pipelines, when you don't need it my
preference is to keep it simple.

Static files also happen to be both incredibly fast and transparent for anyone
who goes snooping in their browser's developer tools. Two big selling points for
a portfolio site.

## Usage

The easiest way to use this project is just to
[visit the url](https://zacis.me). If for some reason you really want to run the
page locally, that is also possible.

First clone the repo and install the dependencies
(requires [Node](https://nodejs.org/)):

```
git clone https://github.com/delventhalz/zacis.me.git
cd zacis.me/
npm install
```

This installs [http-server](https://github.com/http-party/http-server), which
the "start" script will use to host the files in the public folder.

```
npm start
```

The page is hosted at `http://localhost:24715` and should automatically be
opened in your default browser. Manually reload the page as needed to pick up
code changes.

## Contributing

If you happen to run into a bug particular to your setup, I would of course
appreciate a [GitHub issue](https://github.com/delventhalz/zacis.me/issues/new).
If you can include your screen/window size, browser, and platform, with the
issue, so much the better.

## License

All the code is [MIT](./LICENSE) licensed. If you see something useful, feel
free to grab it.
