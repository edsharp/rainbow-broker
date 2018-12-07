Rainbow broker
==============

Introduction
------------

The rainbow broker allows one physical neopixel display to be shared between many clients.

When a client visits the website, they will see two virtual displays:

1. My display; and
2. Virtual mirror

You can password protect your display so that only your scripts can drive your display.

You can request that your display is mirrored on the real physical display, in which case
your request will be dealt with in a FIFO queue.

### The broker rules

When you reach the front of the queue, the following rules control how long you'll
retain control:

* If no one else is queued, you can keep control forever

If there's a queue, you lose control if:

1. you don't send a frame for more than 3s; or
2. your total session has exceeded 30s

Getting started
---------------

You need to generate an SSL cert:

```
openssl genrsa -out localhost.key 2048
openssl req -new -x509 -key localhost.key -out localhost.cert -days 3650 -subj /CN=localhost
```

For development:

```
npm install
npm run dev
```

For production:

```
npm build
npm start
```

If you need to rebuild `components/logo.jsx` you can run `svg_generator.py`.
