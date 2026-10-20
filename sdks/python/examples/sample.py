from postman_custedu import PostmanCusteduApi, PostmanCusteduApiEnvironment

sdk = PostmanCusteduApi(
    access_token="YOUR_ACCESS_TOKEN",
    base_url=PostmanCusteduApiEnvironment.DEFAULT.value,
    timeout=10,
)

result = sdk.customers.list_customers(
    email="Ronald47@gmail.com",
    phone="phone",
    last_name="lastName",
    limit=20,
    cursor="cursor",
)

print(result)
