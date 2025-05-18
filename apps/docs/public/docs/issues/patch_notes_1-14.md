# Batch Code Feature - Business Logic Overview

It could just find the batch that the worker is currently scanning drums into, giving them freedom to input the batch code whenever they like.

Except there are business constraints, namely _trust no one, especially our employees_.

So the workers have to be given rigid constraints - that force them to input the batch code, without sacrificing user-friendliness in the face of, apparenly, not-so-friendly users.

But right now, the action of scanning drums in from a new delivery _is the very event that creates the new batch record_. So this needs revamping: authorise the user, get the required batch code, validate against known supplier codes' text patterns, link that batch they just created with the active scanning task context for the purchase order, then finally enable scanning of drums, linking each to the new batch and incrementing its total count. On the surface this is all completely invisible, by design.

**Good times create weak men**. They'll never know that they are being controlled, that their actions are playing right into the constricting logical bindings of the code. That these "tasks" are here only to empower the workers to tell the intelligent system to "please proceed with managing our inventory, please and thank you"; tasks aimed at subverting the established ethos, speficially curated to prohibit the ability of any worker to assert, insert nor upsert any agency of their own.

They'll never know that their every action is being logged into comprehensive auditing tables, readily available for new investors in the company to peruse and select from, in a manner which I, in earnest, can describe only as corporate eugenics.

**Weak men create hard times**. They don’t know that soon they will face real competition, of an unfamiliar and unwelcoming kind. What will begin as a friendly weekly leaderboard on inventory scans - an innocuous, jovial rivarly between pals - will soon descend into a self-sustained and self-imposed unadulterated zeitgeist of vicious individualism, as the system scales around the workforce, growing from a few drums per day to encompass the entire machinations of our operational processes, with Terminator's Skynet watching with pride as one does with a child.

**Hard times create strong men**. Weekly contributions and “scanner of the month” accolades will transcend into an efficiency machine powered by its ever-present fuel source of dog-eat-dog primal activity, as it serves as the conduit for enriching business owners. The insecurity and fear that superior technology has always rightly merited in the mind of the Luddite will usher in a goal-oriented, hard-working labour reserve; upticks in efficiency gains overshadowing the ever-nearing bring of insanity now visible to those whose worldview has been uprooted. There was never any lifelong security, never any utopian work culture, never the people-first atmosphere that the decades-long illusion promoted by incompetency may have suggested.

**Strong men create shareholder value**. The workers will synthesise their own undoing - the inevitable culture change of productivity maximisation for the valorous goal of growing shareholder value at the cost of stakeholder representation, as all things should be in any profit-driven company worth its hydrochloric salt. And those who dared to defy capitalism will be the first to shake the invisible hand of Adam Smith.

And to conclude, the modification to the trigger function will be to ensure that the batch code is always validated against the known supplier codes' text patterns, and that the new batch record is always linked to the active scanning task context for the purchase order.
