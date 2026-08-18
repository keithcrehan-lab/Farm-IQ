import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Field } from '../fields/field.entity';

@Entity('soil_tests')
export class SoilTest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Field, (field) => field.soilTests, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'field_id' })
  field: Field;

  @Column({ name: 'field_id' })
  fieldId: string;

  @Column({ type: 'date', name: 'sample_date' })
  sampleDate: string;

  @Column({ type: 'varchar', name: 'lab_name', nullable: true })
  labName: string | null;

  @Column({ type: 'numeric', precision: 3, scale: 1 })
  ph: number;

  /** Teagasc-style soil fertility index, 1 (very low) – 4 (high). Target is 3. */
  @Column({ type: 'int', name: 'p_index' })
  pIndex: number;

  @Column({ type: 'int', name: 'k_index' })
  kIndex: number;

  @Column({ type: 'int', name: 'mg_index', nullable: true })
  mgIndex: number | null;

  @Column({ type: 'numeric', precision: 4, scale: 1, name: 'organic_matter_pct', nullable: true })
  organicMatterPct: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
