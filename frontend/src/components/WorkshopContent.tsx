import { BookOpen, CheckCircle2, Clock, Users } from "lucide-react";

type WorkshopContentProps = {
  highlights: string[];
  includes: string[];
  duration: string;
  level: string;
  seatsTotal: number;
};

const WorkshopContent = ({
  highlights,
  includes,
  duration,
  seatsTotal,
}: WorkshopContentProps) => {
  return (
    <section className="mt-10 space-y-8 border-t pt-8">
      <div>
        <h2 className="text-2xl font-semibold">Thông tin workshop</h2>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border p-4">
            <Clock className="size-5 text-primary" />

            <p className="mt-3 text-sm text-muted-foreground">Thời lượng</p>

            <p className="mt-1 font-semibold">{duration}</p>
          </div>

          <div className="rounded-2xl border p-4">
            <Users className="size-5 text-primary" />

            <p className="mt-3 text-sm text-muted-foreground">Quy mô lớp</p>

            <p className="mt-1 font-semibold">Tối đa {seatsTotal} người</p>
          </div>
        </div>
      </div>

      {highlights.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold">Bạn sẽ học được gì?</h2>

          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {highlights.map((highlight, index) => (
              <li
                key={`${highlight}-${index}`}
                className="flex items-start gap-3 rounded-xl bg-muted/50 p-4"
              >
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />

                <span>{highlight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {includes.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold">Chi phí đã bao gồm</h2>

          <ul className="mt-4 space-y-3">
            {includes.map((item, index) => (
              <li key={`${item}-${index}`} className="flex items-center gap-3">
                <CheckCircle2 className="size-5 shrink-0 text-emerald-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};

export default WorkshopContent;
