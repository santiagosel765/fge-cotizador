import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCreditRequestDto } from './dto/create-credit-request.dto';
import { CreditRequest, CreditRequestStatus } from './entities/credit-request.entity';

type CreateCreditRequestResponse = Pick<CreditRequest, 'id' | 'ticketNumber' | 'status' | 'createdAt'>;

type AuthUser = {
  userId?: string;
  id?: string;
};

@Injectable()
export class CreditRequestsService {
  constructor(
    @InjectRepository(CreditRequest)
    private readonly creditRequestRepository: Repository<CreditRequest>,
  ) {}

  async create(dto: CreateCreditRequestDto, user?: AuthUser): Promise<CreateCreditRequestResponse> {
    const creditRequest = new CreditRequest();
    creditRequest.projectId = dto.projectId;
    creditRequest.applicantName = dto.applicantName.trim();
    creditRequest.phone = dto.phone.trim();
    creditRequest.notes = dto.notes?.trim() || null;
    creditRequest.userId = user?.userId ?? user?.id ?? null;
    creditRequest.status = CreditRequestStatus.SUBMITTED;
    creditRequest.ticketNumber = await this.generateTicketNumber();

    const saved = await this.creditRequestRepository.save(creditRequest);

    return {
      id: saved.id,
      ticketNumber: saved.ticketNumber,
      status: saved.status,
      createdAt: saved.createdAt,
    };
  }

  async findAll(projectId?: string): Promise<CreditRequest[]> {
    return this.creditRequestRepository.find({
      ...(projectId ? { where: { projectId } } : {}),
      order: { createdAt: 'DESC' },
    });
  }

  private async generateTicketNumber(): Promise<string> {
    const date = new Date();
    const datePart = [
      date.getFullYear().toString(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('');

    while (true) {
      const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const ticketNumber = `CR-${datePart}-${randomPart}`;
      const existing = await this.creditRequestRepository.exists({ where: { ticketNumber } });
      if (!existing) {
        return ticketNumber;
      }
    }
  }
}
