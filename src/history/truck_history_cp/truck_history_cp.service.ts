import { Injectable } from '@nestjs/common';
import { CreateTruckHistoryCpDto } from './dto/truck_history_cp.dto';
import { ErrorHandlerService } from '@utils/error-handler.service';
import { InjectRepository } from '@nestjs/typeorm';
import { TruckHistoryCpEntity } from './entities/truck_history_cp.entities';
import { Cps } from 'src/jobs/entities/cps.entity';
import { Not, Repository } from 'typeorm';
import { CpQueueAssignmentsEntity } from 'src/services/entities/cpQueueAssignment.entities.entity';

@Injectable()
export class TruckHistoryService {
  constructor(
    @InjectRepository(TruckHistoryCpEntity)
    private readonly truckHistoryCPRepository: Repository<TruckHistoryCpEntity>,
    @InjectRepository(Cps)
    private readonly cpsRepository: Repository<Cps>,
    @InjectRepository(CpQueueAssignmentsEntity)
    private readonly cpQueueAssignmentsRepository: Repository<CpQueueAssignmentsEntity>,
    private readonly errHandler: ErrorHandlerService,
  ) {}
  async saveTruckHistoryCPRFID(
    is_valid: boolean,
    truck_id: number,
    cp_id: number,
    in_out: string,
  ): Promise<any> {
    try {
      const [cp_name, assignmentData] = await Promise.all([
        this.getCPName(cp_id),
        this.getAssignmentId(truck_id),
      ]);
      const { assignment_id, nomor_lambung } = assignmentData;
      const data: CreateTruckHistoryCpDto = {
        assignment_id: assignment_id,
        truck_id: truck_id,
        status: `Deteksi RFID`,
        description:
          is_valid === true
            ? `Unit ${nomor_lambung} RFID ${in_out} terdeteksi di ${cp_name}`
            : `RFID tidak terdeteksi`,
      };
      await this.truckHistoryCPRepository.save(data);
    } catch (error) {
      this.errHandler.logDebug(`saveTruckHistoryCP error: ${error}`);
    }
  }
  async getCPName(cp_id: number): Promise<any> {
    if (cp_id != null) {
      const result = await this.cpsRepository.findOne({
        where: { cp_id: cp_id },
      });
      return { cp_name: result?.cp_name ?? '' };
    } else {
      return { cp_name: '' };
    }
  }
  async getAssignmentId(truck_id: number): Promise<any> {
    const result = await this.cpQueueAssignmentsRepository.find({
      select: ['assignmentId', 'nomorLambung'],
      where: {
        truckId: truck_id,
        status: Not('COMPLETED'), // Menggunakan Not dari TypeORM
      },
      order: {
        assignmentId: 'DESC',
      },
      take: 1, // Sama seperti LIMIT 1
    });

    if (result.length === 0) {
      return { assignment_id: null, nomor_lambung: '' };
    }
    const { assignmentId, nomorLambung } = result[0];
    return { assignment_id: assignmentId, nomor_lambung: nomorLambung };
  }
}
