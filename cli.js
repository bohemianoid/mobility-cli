#!/usr/bin/env node
const got = require('got');
const url = require('url');
const date = require('date.js');
const columns = require('cli-columns');
const yargs = require('yargs');

const getCategories = function getCategories() {
  return new Promise((resolve, reject) => {
    got('https://api.mobility.ch/v1/public/clients/10/categories', {
      json: true
    })
      .then((response) => {
        resolve(response.body.categories);
      });
  });
};

const getCategory = function getCategory(name) {
  return new Promise((resolve, reject) => {
    getCategories()
      .then((categories) => {
        return categories.find((category) => {
          return category.name.toLowerCase() === name;
        });
      })
      .then((category) => {
        resolve(category);
      });
  });
};

const getPrice = function getPrice(argv) {
  const from = date(argv.from);
  const to = date(argv.to, from);

  getCategory(argv.category)
    .then((category) => {
      const request = url.parse('https://api.mobility.ch/v1/public/clients/10/prices');
      request.query = {
        lang: 'de',
        show_ics: true,
        show_bcs: false,
        category_ids: category.id,
        from: from.toISOString(),
        to: to.toISOString(),
        distance: Math.ceil(argv.distance)
      };

      return request;
    })
    .then((request) => {
      return got(request, {
        json: true
      });
    })
    .then((response) => {
      return response.body.individual_customer_subscriptions[0].categories[0].prices;
    })
    .then((prices) => {
      const price = (Math.ceil(prices.total_price / 0.05) * 0.05).toFixed(2);
      console.log(`CHF ${price}`);
    });
};

const listCategories = function listCategories(argv) {
  getCategories()
    .then((categories) => {
      return categories.map((category) => {
        return category.name.toLowerCase();
      });
    })
    .then((categories) => {
      console.log(columns(categories));
    });
};

yargs
  .command(
    '* <category> <from> <to> <distance>',
    'calculate price',
    () => {},
    (argv) => getPrice(argv)
  )
  .command(
    'categories',
    'list vehicle categories',
    () => {},
    (argv) => listCategories(argv)
  )
  .help()
  .version()
  .argv;
