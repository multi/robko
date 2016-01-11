# robko

robko is a Camplight chat bot built on the [Hubot][hubot] framework.

[hubot]: http://hubot.github.com

### requirements

* Redis

### running

define required env params in `.env.sh`

    $ touch .env.sh

start

    $ source .env.sh && bin/hubot

### environment parameters

#### required

    HUBOT_TEAM_ADMIN

#### available

    HUBOT_LOG_LEVEL
    EXPRESS_USER
    EXPRESS_PASSWORD
    EXPRESS_PORT
    EXPRESS_BIND_ADDRESS

    REDIS_URL
