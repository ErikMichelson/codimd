# Linkify header style setting

CodiMD automatically generates links for headings. There are different ways to generate the link:

_Example heading:_ "3.1. Good Morning my Friend! - Do you have 5$?"

**`keep-case`**  
This is the legacy CodiMD value. Special chars will be removed, spaces and dots are replaced with hyphens.  
_Link:_  "#31-Good-Morning-my-Friend---Do-you-have-5"

**`lower-case`**  
This is the same like legacy (see above), but converted to lower-case.  
_Link:_  "#31-good-morning-my-friend---do-you-have-5"

**`gfm`**  
This is the [_GitHub-Flavored Markdown_](https://gist.github.com/asabaylus/3071099#gistcomment-1593627) variant.
It works like `lower-case`, but making sure the link is unique.
This is what GitHub, GitLab and (hopefully) most other tools use. It is therefore the default value for new installations of CodiMD.  
_Link 1:_  "31-good-morning-my-friend---do-you-have-5"  
_Link 2:_  "31-good-morning-my-friend---do-you-have-5-1"  
_Link 3:_  "31-good-morning-my-friend---do-you-have-5-2"
