# robko

robko is a Camplight chat bot built on the [Hubot][hubot] framework.

[hubot]: http://hubot.github.com

### requirements

* Redis

### running

    $ npm i --no-optional

define required env params in `.env.sh`

    $ touch .env.sh

start

    $ node_modules/.bin/nodemon -w .touch-to-restart -x bin/hubot -r scripts-multi [-r scripts-{github-handle} -r ...]

### environment parameters

#### required

    ENV_FILE=.env.sh
    HUBOT_AUTH_ADMIN
    HUBOT_TEAM_ADMIN
    EXPRESS_PORT=3131

#### available

    HUBOT_LOG_LEVEL=info
    EXPRESS_USER
    EXPRESS_PASSWORD
    EXPRESS_BIND_ADDRESS="0.0.0.0"

    REDIS_URL="redis://localhost"

    HUBOT_CASH_CURRENCY_SYMBOL="$"
    HUBOT_CASH_THOUSANDS_SEPARATOR=","

    HUBOT_HISTORY_LINES=10

    HUBOT_QUOTE_MAX_LINES=4

    HUBOT_TELL_ALIASES - Comma-separated string of command aliases for "tell".
    HUBOT_TELL_RELATIVE_TIME - Set to use relative time strings ("2 hours ago")

    HUBOT_GOOGLE_CSE_KEY - Your Google developer API key
    HUBOT_GOOGLE_CSE_ID - The ID of your Custom Search Engine
    HUBOT_MUSTACHIFY_URL - Optional. Allow you to use your own mustachify instance.
    HUBOT_GOOGLE_IMAGES_HEAR - Optional. If set, bot will respond to any line that begins with "image me" or "animate me" without needing to address the bot directly
    HUBOT_GOOGLE_SAFE_SEARCH - Optional. Search safety level.
    HUBOT_GOOGLE_IMAGES_FALLBACK - The URL to use when API fails. `{q}` will be replaced with the query string.

    HUBOT_9GAG_NO_GIFS
