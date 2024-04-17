/*
! I added this polyfill to solve the following problem:

! In the main process (in the table API), I called "gittable-editor"'s TableOps.initialize() which creates a new Table and calls "uuid"'s v4(), 
! which calls node's crypto.getRandomValues()
! It gave me the error : crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported

! It seems that for some reason, uuid is not able to find the crypto.getRandomValues()
! The issue is documented in uuid's https://github.com/uuidjs/uuid?tab=readme-ov-file#getrandomvalues-not-supported
! but they provide a solution for react-native not for electron (I tried the solution for react-native but it didn't work)

! I then found and implemented this solution that worked : https://github.com/aws/aws-sdk-js-v3/discussions/3950#discussioncomment-4337769
! 1. I installed @rollup/plugin-node-resolve: npm i -D @rollup/plugin-node-resolve
! 2. I modified electron.vite.config.ts
! 3. I added this polyfills/cyrpto.js file
! 4. I added import "./polyfills/crypto"; to main/index.ts

! And it worked!!

! Note that that the issue with uuid calling crypto.getRandomValues() only occurs in the main process
! If I call TableOps.initialize() in the renderer process, and send the created Table to the main process,
! I should not see the problem (and I can remove this polyfill)
! (I did not test it, but in the renderer, I call uuid to create records and columns)
! For now, I will keep this polyfill, as I don't know if in the future I may need to call uuid in the main process 

*/

import crypto from "crypto"; // should have webcrypto.getRandomValues defined

if (typeof global.crypto !== "object") {
  global.crypto = crypto;
}

if (typeof global.crypto.getRandomValues !== "function") {
  global.crypto.getRandomValues = getRandomValues;
}

function getRandomValues(array) {
  return crypto.webcrypto.getRandomValues(array);
}
