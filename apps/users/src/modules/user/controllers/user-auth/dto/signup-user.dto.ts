import { PendingUser } from '@instapets-backend/common';
import { Matches } from 'class-validator';

export class SignupUserDto extends PendingUser {
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#\-+=^~_.,;:\\/()<>{}\[\]`|"])[A-Za-z\d@$!%*?&#\-+=^~_.,;:\\/()<>{}\[\]`|"]{8,}$/,
    {
      message: 'Password too weak',
    },
  )
  password: string;
}
