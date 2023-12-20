import { tellAboutUnits } from '../src/tellAboutUnits'

const unit = {
  name: 'Batumi house',
  url: 'https://www.myhome.ge/en/pr/16941560/House-for-sale-baTumshi-shoTa-rusTavelis-qucha-%2841-61%29%2C-Zveli-baTumis-ubani%2C-Zveli-baTumis-ubani%2C-baTumi-3-rooms',
  id: '16941560',
  createdAt: 1702645320000,
  squireMeterPrice: 1869,
  price: 200000,
  imageUrl:
    'https://static.my.ge/myhome/photos/0/6/5/1/4/thumbs/16941560_1.jpg?v=1',
}

tellAboutUnits([unit])
