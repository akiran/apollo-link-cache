import React from 'react'
import {graphql} from 'react-apollo'
import {userQuery} from './queries'

class User extends React.Component {
  render() {
    const {user} = this.props
    return (
      <div
        style={{margin: '10px', background: user.selected ? 'green' : 'red'}}>
        {user.id}{user.firstName}
      </div>
    )
  }
}

const UserContainer = graphql(userQuery, {
  props: ({data: {loading, user}}) => {
    return {user: loading ? {} : user }
  },
  options: (props) => {
    return {variables: {id: props.id}}
  }
})(User)

function UserList() {
  return (
    <div>
      <UserContainer id={1} />
      <UserContainer id={2} />
      <UserContainer id={3} />
    </div>
  )
}

export default UserList
