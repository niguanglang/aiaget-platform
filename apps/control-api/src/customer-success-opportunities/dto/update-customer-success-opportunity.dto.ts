import { PartialType } from '@nestjs/swagger';

import { CreateCustomerSuccessOpportunityDto } from './create-customer-success-opportunity.dto';

export class UpdateCustomerSuccessOpportunityDto extends PartialType(CreateCustomerSuccessOpportunityDto) {}
