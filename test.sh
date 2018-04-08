#! bin/bash
echo -e "\033[31m Please make sure your key to fill in the following \033[0m"
AAD_TENLENT_ID='YOUR_AAD_TENLENT_ID' \
AAD_CLIENT_ID='YOUR_AAD_CLIENT_ID' \
AAD_USER_NAME='YOUR_AAD_USER_NAME' \
AAD_USER_PASSWORD='YOUR_AAD_USER_PASSWORD' \
npm run test-cov;