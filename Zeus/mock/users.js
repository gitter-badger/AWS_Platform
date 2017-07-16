import { Model } from '../lib/all'
export const user = {
  username:'faker',
  hash:'long hash',
  email:'faker@gmail.com',
  createdAt:1499014688026,
  updatedAt:1499014702263,
  gender:1,
  usn: Model.genUSN(),
  roles:'10000'
}
