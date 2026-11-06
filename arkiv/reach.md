# Arkiv: reach

The keeper query filters against `marginRatioBps < 10000`, which means
exactly: any book whose equity is inside its net initial margin. In the
golden vector set, GV-04 (the post-withdrawal state at `12,000e6` posted
versus `16,500e6` required) lands at a `marginRatioBps` of `7272` and
appears as UNWIND_ELIGIBLE §-immediately — it is the state the withdrawal
guard already blocks ·onchain.

Real reach depends on the book's crash margin ratio: inside the envelope a
healthy book is 150–200% of IM_net, so it never flags UNWIND_ELIGIBLE until
a crash or sweep leaves it under water. The keeper's job is discovery for
liquidations that the set of active survivors has already accepted.
