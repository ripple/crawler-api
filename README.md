As of 8/5/2015 hosted at http://10.30.72.248:1234/

### RUN

``` bash
npm install
node server.js <host> <port> <db_url>
```

### API

#### GET `/ipp`

Returns array of unique ipps in latest crawl.

```
[
  "54.186.73.52:51235",
  "107.150.44.226:51235",
  "104.233.75.182:51235",
  "192.170.145.67:51235",
  "93.190.138.234:51235",
  ...
]
```

#### GET `/rippleds`

Returns array of unique rippleds in latest crawl with some info.

```
[
  {
    "public_key" : "n9K1mJQsaSMzNgwY7vXGLzh9h6HVpSCeRu3J5HESrgBKGewiuSQL",
    "ipp": "107.150.44.226:51235",
    "version": "rippled-0.28.2",
    "in": 10,
    "out": 2
  },
  ...
]
```
