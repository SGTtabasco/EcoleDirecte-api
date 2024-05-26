EcoleDirecte-API
================

This is a simple API for EcoleDirecte
at the moment, it can only connect to the account and get all the information about the user.

It supports the Double Authentification

## Installation
```bash
npm install https://github.com/SGTtabasco/EcoleDirecte-api
```

## Usage - Basic
```typescript
import User from 'ecoledirecte-api';

const user = new User('username', 'password');
user.login().then((r) => {
    console.log(r); // code, message, type
    console.log(user.responceLogin); // full reponse of EcoleDirecte
    console.log(user.token); // token EcoleDirecte
});
```

## Usage - Double Authentification
```typescript
import User from 'ecoledirecte-api';

const user = new User('username', 'password');

user.login().then(async (r) => {
    if (r.type == 'NEED_DOUBLE_AUTH') {
        r.double_auth.question // question for the double auth
        r.double_auth.propositions // reponse for the double auth
        
        user.validate_double_auth('reponse').then((r) => {
            console.log(r); // code, message, type
            console.log(user.responceLogin); // full reponse of EcoleDirecte
            console.log(user.token); // token EcoleDirecte
        });
    }
});
```