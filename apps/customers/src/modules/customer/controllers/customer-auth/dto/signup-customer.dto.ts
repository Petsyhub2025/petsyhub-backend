import { PendingCustomer } from '@instapets-backend/common';
import { Matches } from 'class-validator';

export class SignupCustomerDto extends PendingCustomer {
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#\-+=^~_.,;:\\/()<>{}\[\]`|"])[A-Za-z\d@$!%*?&#\-+=^~_.,;:\\/()<>{}\[\]`|"]{8,}$/,
    {
      message: 'Password too weak',
    },
  )
  password: string;
}
