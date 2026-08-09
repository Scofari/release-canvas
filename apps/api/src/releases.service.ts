import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { canTransitionRelease, releaseStatusSchema, type ReleaseStatus } from '@release-canvas/contracts';

@Injectable()
export class ReleasesService {
  private status: ReleaseStatus = 'in_review';
  getDemo() { return { id: 'e3a366d8-2b2b-4c75-85d1-3f69cd983ad7', name: 'Checkout refinement · RC 2', status: this.status, openAnnotations: 3, resolvedAnnotations: 8, progress: 73 }; }
  transition(nextValue: string) {
    const parsed = releaseStatusSchema.safeParse(nextValue);
    if (!parsed.success) throw new BadRequestException('Unknown release status');
    if (!canTransitionRelease(this.status, parsed.data)) throw new BadRequestException(`Cannot transition ${this.status} to ${parsed.data}`);
    this.status = parsed.data;
    return this.getDemo();
  }
  find(id: string) { if (!id) throw new NotFoundException(); return this.getDemo(); }
}
