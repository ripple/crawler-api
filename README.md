As of 8/5/2015 hosted at http://10.30.72.248:1234/

### RUN

``` bash
npm install
node server.js <host> <port> <db_url>
```

### API

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
