module.exports = {
  'api': {
    input: {
      target: 'http://139.224.63.0:8000/v2/api-docs',
      validation: false,
    },
    output: {
      mode: 'split',
      target: './src/api/generated',
      client: 'react-query',
      prettier: true,
      override: {
        mutator: {
          path: './src/api/request.ts',
          name: 'request',
        },
        query: {
          useQuery: true,
          useInfinite: true,
          useInfiniteQueryParam: 'pageParam',
        },
      },
    },
  },
}; 