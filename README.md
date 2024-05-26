EcoleDirecte-API
================

This is a simple API for EcoleDirecte
at the moment, it can only connect to the account and get all the informations about the user.

## Installation
```bash
npm install ecoledirecte-api
```

## Usage
```typescript
import User from 'ecoledirecte-api';

const user = new User('username', 'password');
user.login().then((r) => {
    console.log(r);
    console.log(user.responceLogin);
    console.log(user.token);
});
