import gql from 'graphql-tag'

export const usersQuery = gql`
  {
    users {
      id
      firstName
      lastName
      selected
    }
  }
`

export const toggleUserMutation = gql`
  mutation toggleUser($index: Int) {
    toggleUser(index: $index) @client
  }
`

export const userQuery = gql`
  query userQuery($id: Int) {
    user(id: $id) @cache {
      id
      firstName
      lastName
      selected
    }
  }
`

export const userFragment = gql`
  fragment userFragment on User {
    id
    firstName
    lastName
    selected
  }
`
