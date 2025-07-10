# zacis.me

This is the source code for my portfolio site, [zacis.me](https://zacis.me).
It is built with HTML, CSS, and JavaScript, [Preact](https://preactjs.com/) for
the dynamic project gallery, and [html2canvas](https://html2canvas.hertzen.com/)
for the funhouse mirror effect. That's about it. There is no build step. The
files in [public/](./public) are served as is.

Why so simple?

Every tool you add to a project introduces complexity. This is true of all code
of course, whether yours or someone else's. I think every addition to a project
should be useful enough to justify the complexity it adds. On a large team, I am
often the strongest advocate for sophisticated frameworks, robust build
pipelines, and strict types and testing, but when you don't need it, don't use
it.

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
If you can include your screen/window size, browser, and platform, so much the
better.

## License

All the code is [MIT](./LICENSE) licensed. If you see something useful, feel
free to grab it.
