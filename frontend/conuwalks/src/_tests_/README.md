# UnitTests Using Jest Testing Framework

## How to run the test  

1. `cd frontend/conuwalks`  

2. Install Required Libraries:

```sh
npm install --save-dev jest jest-expo @testing-library/react-native @testing-library/jest-native react-test-renderer@19.1.0 @types/jest --legacy-peer-deps
```  

1. Install dependencies  

   ```bash  
   npm install  
   ```  

2. Make sure that in package.json file you have this script:
"test": "jest --verbose"

3. npm test

4. To run test in watch mode:
npm test -- --watch  

5. To run with coverage
npm test -- --coverage  

6. Clear caches and run tests  
npm test -- --clearCache  
npm test  

## Troubleshooting

Common Issue: "Cannot find module '@testing-library/react-native'"  
Sloution:  npm install --save-dev @testing-library/react-native --legacy-peer-deps
