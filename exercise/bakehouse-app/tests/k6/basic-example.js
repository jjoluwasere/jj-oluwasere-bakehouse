import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  vus: 2,
  duration: '10s',
};

export default function () {
  let res = http.get('https://jj-oluwasere-bakehouse.cta-training.academy/api/products');
  sleep(5);
}