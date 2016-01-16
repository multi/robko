# robko

robko is a Camplight chat bot built on the [Hubot][hubot] framework.

[hubot]: http://hubot.github.com

### requirements

* Redis

### running

    $ cd robko
    $ npm i --no-optional

define required env params in `.env.sh`

    $ touch .env.sh

generate ssh key

    $ mkdir keys
    $ ssh-keygen -t rsa -b 4096 -C "robko@"$(hostname) -f keys/id_rsa -N ''
    $ chmod 400 keys/*

start

    $ node_modules/.bin/nodemon -w .touch-to-restart -x bin/hubot -r scripts-multi [-r scripts-{github-handle} -r ...]

### environment parameters

#### required

    ENV_FILE=.env.sh
    HUBOT_ENDPOINT=https://example.com
    HUBOT_AUTH_ADMIN
    HUBOT_TEAM_ADMIN
    EXPRESS_PORT=3131

#### available

    HUBOT_LOG_LEVEL=info

    EXPRESS_USER
    EXPRESS_PASSWORD
    EXPRESS_BIND_ADDRESS="127.0.0.1"
    EXPRESS_STATIC

    REDIS_URL="redis://localhost"

    HUBOT_CASH_CURRENCY_SYMBOL="$"
    HUBOT_CASH_THOUSANDS_SEPARATOR=","

    HUBOT_TELL_ALIASES - Comma-separated string of command aliases for "tell".
    HUBOT_TELL_RELATIVE_TIME - Set to use relative time strings ("2 hours ago")

    HUBOT_GOOGLE_CSE_KEY - Your Google developer API key
    HUBOT_GOOGLE_CSE_ID - The ID of your Custom Search Engine
    HUBOT_MUSTACHIFY_URL - Optional. Allow you to use your own mustachify instance.
    HUBOT_GOOGLE_IMAGES_HEAR - Optional. If set, bot will respond to any line that begins with "image me" or "animate me" without needing to address the bot directly
    HUBOT_GOOGLE_SAFE_SEARCH - Optional. Search safety level.
    HUBOT_GOOGLE_IMAGES_FALLBACK - The URL to use when API fails. `{q}` will be replaced with the query string.

    HUBOT_GITHUB_WEBHOOK_SECRET

    ORGANIC_CELLS_PATH

    GIT_SSH_COMMAND="ssh -i keys/id_rsa -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no -o IdentitiesOnly=yes"
