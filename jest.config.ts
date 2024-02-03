// jest.config.ts

/*
It took me a while, but I was able to add jest support with my electron-vite project
1. I installed ts-node : npm i ts-node -D
2. I copied jest.config.ts (just the preset), in the future I may need to copy or add other configs
*/
export default {
  preset: "ts-jest",
  /*
  I added this to solve multiple jest problems. 
  My tsconfig.json has 2 project references: tsconfig.node.json & tsconfig.web.json.
  But ts-jest doesn't seem to follow project references, and only reads tsconfig.json.
  So it's missing crucial parameters present in those 2 files to compile the project and run tests.

  It seems that the most crucial parameters that it needs to work properly are : 
     "paths": {
            "@sharedTypes/*": ["./src/types/*"]
      }

  Note : If there's a future error, consider looking into adding "esModuleInterop": true,

  So, I changed the Jest config below: I told it to read tsconfig.node.json instead. and it worked
  Although, it might mean that I won't be able to write tests for the renderer, only for the Main

  It works, but jest gives me a warning as "globals" is deprecated.
  TODO: resvole this warning: see https://stackoverflow.com/a/76064718/471461
  
   */
  globals: {
    "ts-jest": {
      tsconfig: "<rootDir>/tsconfig.node.json",
    },
  },
};
