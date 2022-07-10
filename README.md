## Notes for editing and deployment

The files edited are:

* `data/homepage.yml`
* `config.toml`
* `layouts/partials` for new pages
* Materials are copied into the `static` folder

There should be no need to modify the installed theme, which is `raditian-free-hugo-theme`

Deployment uses a buildpack from [roperzh](https://github.com/roperzh/heroku-buildpack-hugo) updated 
by Joan Tolós (See [his blog post](https://www.joantolos.com/blog/deploying_hugo_app_in_heroku/) for details).
So the actual buildpack is from [this](https://github.com/joantolos/kata-hugo-heroku-buildpack) GitHub repository.

To update, `add` and `commit` any edits, then run:

`git push heroku main`

Note you can probably get away with just `git push`.

    Ken Kousen, July 10, 2022
