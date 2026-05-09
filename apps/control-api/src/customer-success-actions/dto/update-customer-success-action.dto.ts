import { PartialType } from '@nestjs/swagger';

import { CreateCustomerSuccessActionDto } from './create-customer-success-action.dto';

export class UpdateCustomerSuccessActionDto extends PartialType(CreateCustomerSuccessActionDto) {}
