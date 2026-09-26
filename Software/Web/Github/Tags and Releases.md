# Tags
Tags are labels that point to specific commits in the git history. They're used to mark certain commits are important or noteworthy, and usually indicate why in the tag name. Optionally, a tag can also contain annotations such as a message or description, the name and email of the tagger, etc.

Tags live in `.git/ref/tags/` as plaintext files containing a hash that points to a git object in the `.git/objects/` folder. Deeper in the git objects is any annotation data.

### Lightweight vs. Annotated Tags
Annotated tags contain metadata; lightweight tags are just labels. The Git manual says it well:
>Annotated tags are meant for release while lightweight tags are meant for private or temporary object labels.

## Tag Commands
- Create a lightweight tag
	- Syntax: `git tag <tag name>`
	- This creates a tag pointing to the commit at the current HEAD.
	- Example: `git tag v1.0`
- Create an annotated tag
	- Syntax: 
- List tags
	- Syntax: `git tag` or `git tag -l`
- List tags with a filter
	- Syntax: `git tag -l <filter text>`
	- Example: `git tag -l v1.5.*`
	- The above will filter for any tags in the v1.5.x range.

# Releases


# References
- [Git Basics - Tagging](https://git-scm.com/book/en/v2/Git-Basics-Tagging)
- [Managing Releases in a Repository by Github](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository)