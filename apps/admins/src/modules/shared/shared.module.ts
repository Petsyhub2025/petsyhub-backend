import { Module } from '@nestjs/common';

const imports = [];
const providers = [];

@Module({
  imports,
  providers,
  exports: [...imports, ...providers],
})
export class SharedModule {}
