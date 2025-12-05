import { IsNumber, IsString, IsNotEmpty } from 'class-validator';

export class CreateOrderDto {
    @IsNumber()
    @IsNotEmpty()
    amount: number;
}

export class VerifyPaymentDto {
    @IsString()
    @IsNotEmpty()
    orderId: string;

    @IsString()
    @IsNotEmpty()
    paymentId: string;

    @IsString()
    @IsNotEmpty()
    signature: string;

    @IsNumber()
    @IsNotEmpty()
    amount: number;
}
