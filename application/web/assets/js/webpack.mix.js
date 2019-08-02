let mix = require('laravel-mix');

mix.react([
  'transactionListItem.jsx',
  'projectListItem.jsx',
  'itemAbstract.jsx',
  'transaction_search.jsx',
  'project_search.jsx',
  'search.jsx',], 'searchReact.js');