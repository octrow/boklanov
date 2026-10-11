# boklanov

## Git workflow

The owner is the only maintainer of this repo. Work directly on `main`:
commit and push to `main`, with no feature branches and no pull requests,
unless the owner explicitly asks for a branch. This overrides any general
"branch first when on the default branch" guidance.

Before pushing, run tsc, eslint and prettier on the files you touched.
After the deploy, verify the change on boklanov.com.
