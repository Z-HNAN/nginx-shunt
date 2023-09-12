simple nginx shunt system
===

## nginx-config
- `gray.conf` is gray system
- `env` floder is list of test env

## quick start

1. deploy nginx docker  
- network host
- volume `/host/nginx-config` -> `/etc/nginx/conf.d`

2. start shunt-app  
start like a nextjs app

3. request with header `x-flow-version`  
