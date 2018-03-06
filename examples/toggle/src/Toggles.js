import React from 'react'
import { graphql, compose } from 'react-apollo'
import {usersQuery, toggleUserMutation} from './queries'

class Toggles extends React.Component {
  toggleUser = (index) => {
    const { users, mutate } = this.props
    mutate({variables: {index, selected: !users[index].selected}})
  }
  render() {
    const { users } = this.props
    return (
      <div>
        {users.map((user, index) => {
          return (
            <button
              key={index}
              style={{margin: '10px', background: user.selected ? 'green' : 'red'}}
              onClick={() => this.toggleUser(index)}>
              {user.firstName}
            </button>
          )
        })}
      </div>
    )
  }
}

export default compose(
  graphql(usersQuery, {
    props: ({ data: { users } }) => ({ users })
  }),
  graphql(toggleUserMutation),
)(Toggles);
