This example worker syncs Projects from Xledger to the workers sqlite database. It is designed to be run on a cron trigger, such as every 6 hours.

A couple of shortcomings (we might address this at some point):

- No usage of delta queries
- No usage of webhooks