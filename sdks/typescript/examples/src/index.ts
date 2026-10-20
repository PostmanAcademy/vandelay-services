import { PostmanCusteduApiClient } from 'postman-custedu';

(async () => {
  const client = new PostmanCusteduApiClient({
    token: 'YOUR_TOKEN',
  });

  const data = await client.customers.listCustomers({
    email: 'Ronald47@gmail.com',
    phone: 'phone',
    lastName: 'lastName',
    limit: 20,
    cursor: 'cursor',
  });

  console.log(data);
})();
