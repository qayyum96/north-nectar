"use client";

import { cn } from "@northnectar/ui";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { DangerButton, Dialog } from "@/components/dialog";
import { Icon } from "@/components/icon";
import { useToast } from "@/components/toast";
import {
  Card,
  CardHeader,
  Field,
  PageBody,
  PageHeader,
  SelectBox,
  Switch,
  buttonStyles,
  fieldStyles,
  tableStyles,
} from "@/components/ui";
import { type ShippingInput, saveShipping } from "../actions";
import { SettingsFrame } from "../settings-frame";

type Zone = ShippingInput["zones"][number];
type Express = ShippingInput["express"];

const CITIES = [
  "Islamabad",
  "Rawalpindi",
  "Lahore",
  "Karachi",
  "Peshawar",
  "Quetta",
  "Multan",
  "Faisalabad",
  "Sialkot",
  "Gujranwala",
  "Hyderabad",
  "Abbottabad",
  "Gilgit",
  "Skardu",
  "Hunza",
  "Khaplu",
  "Muzaffarabad",
];
const PROVINCES = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Islamabad Capital Territory",
  "Gilgit-Baltistan",
  "Azad Kashmir",
];
const COURIERS = [
  "Leopards Courier",
  "TCS",
  "M&P",
  "PostEx",
  "Trax",
  "Pakistan Post",
  "Local rider",
];
const GRID = { gridTemplateColumns: "1.5fr 90px 110px 1.3fr 1fr 40px" };
const rs = (n: number) => `Rs ${n.toLocaleString("en-US")}`;
const days = (a: number, b: number) =>
  a === b ? `${a} working ${a === 1 ? "day" : "days"}` : `${a} to ${b} working days`;

function ZoneDialog({
  zone,
  onClose,
  onSave,
  onDelete,
}: {
  zone: Zone;
  onClose: () => void;
  onSave: (z: Zone) => void;
  onDelete?: () => void;
}) {
  const [z, setZ] = useState(zone);
  const [cityDraft, setCityDraft] = useState("");
  const num = (v: string) => Math.max(0, Math.round(Number(v.replace(/[,\s]/g, "")) || 0));
  const toggle = (list: string[], item: string) =>
    list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
  const valid =
    z.name.trim().length >= 2 &&
    (z.isFallback || z.cities.length > 0 || z.provinces.length > 0) &&
    z.daysMax >= z.daysMin;
  return (
    <Dialog
      open
      onClose={onClose}
      title={zone.name ? `Edit ${zone.name}` : "Add shipping rate"}
      width={600}
      note={
        onDelete && !zone.isFallback ? (
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex cursor-pointer items-center gap-[6px] border-0 bg-transparent p-0 font-semibold text-[#b42318] hover:underline"
          >
            <Icon name="trash" size={14} />
            Delete rate
          </button>
        ) : undefined
      }
      footer={
        <>
          <button type="button" onClick={onClose} className={buttonStyles.secondary}>
            Cancel
          </button>
          <button
            type="button"
            disabled={!valid}
            onClick={() => onSave({ ...z, name: z.name.trim() })}
            className={cn(buttonStyles.primary, "disabled:opacity-50")}
          >
            <Icon name="check" size={16} />
            Done
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-[14px]">
        <Field label="City or zone name" htmlFor="z-name">
          <input
            id="z-name"
            value={z.name}
            placeholder="e.g. Lahore"
            onChange={(e) => setZ({ ...z, name: e.target.value })}
            className={fieldStyles.input}
          />
        </Field>
        {z.isFallback ? (
          <p className="text-admin-muted m-0 rounded-[10px] bg-[#f7f7f5] p-3">
            This rate covers every city and province not listed in another rate.
          </p>
        ) : (
          <>
            <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
              <legend className="mb-2 p-0 text-[14px] font-semibold">Cities</legend>
              <div className="flex flex-wrap gap-2">
                {[...new Set([...CITIES, ...z.cities])].map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={z.cities.includes(c)}
                    onClick={() => setZ({ ...z, cities: toggle(z.cities, c) })}
                    className={cn(
                      "h-8 cursor-pointer rounded-full border px-3 text-[14px] font-semibold",
                      z.cities.includes(c)
                        ? "border-forest-600 bg-[#eef3ec] text-[#1d4a2c]"
                        : "border-[#d4d4d1] bg-white",
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  aria-label="Another city"
                  value={cityDraft}
                  placeholder="Another city"
                  onChange={(e) => setCityDraft(e.target.value)}
                  className={cn(fieldStyles.input, "h-9 max-w-[220px]")}
                />
                <button
                  type="button"
                  disabled={!cityDraft.trim()}
                  onClick={() => {
                    setZ({ ...z, cities: [...new Set([...z.cities, cityDraft.trim()])] });
                    setCityDraft("");
                  }}
                  className={cn(buttonStyles.secondary, "h-9 disabled:opacity-50")}
                >
                  Add
                </button>
              </div>
            </fieldset>
            <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
              <legend className="mb-2 p-0 text-[14px] font-semibold">Whole provinces</legend>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {PROVINCES.map((p) => (
                  <label key={p} className="inline-flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={z.provinces.includes(p)}
                      onChange={() => setZ({ ...z, provinces: toggle(z.provinces, p) })}
                      className="size-4 accent-forest-600"
                    />
                    {p}
                  </label>
                ))}
              </div>
              <span className="text-admin-muted text-[14px]">
                A city rate wins over a province rate.
              </span>
            </fieldset>
          </>
        )}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Field label="Rate (Rs)" htmlFor="z-rate">
            <input
              id="z-rate"
              inputMode="numeric"
              value={z.rate}
              onChange={(e) => setZ({ ...z, rate: num(e.target.value) })}
              className={fieldStyles.input}
            />
          </Field>
          <Field label="Free over (Rs)" htmlFor="z-free">
            <input
              id="z-free"
              inputMode="numeric"
              placeholder="Never"
              value={z.freeOver ?? ""}
              onChange={(e) =>
                setZ({ ...z, freeOver: e.target.value.trim() ? num(e.target.value) : null })
              }
              className={fieldStyles.input}
            />
          </Field>
          <Field label="Fastest (days)" htmlFor="z-min">
            <input
              id="z-min"
              inputMode="numeric"
              value={z.daysMin}
              onChange={(e) => setZ({ ...z, daysMin: num(e.target.value) })}
              className={fieldStyles.input}
            />
          </Field>
          <Field
            label="Slowest (days)"
            htmlFor="z-max"
            error={z.daysMax < z.daysMin ? "Slower than fastest" : undefined}
          >
            <input
              id="z-max"
              inputMode="numeric"
              value={z.daysMax}
              onChange={(e) => setZ({ ...z, daysMax: num(e.target.value) })}
              className={fieldStyles.input}
            />
          </Field>
        </div>
        <Field label="Courier" htmlFor="z-courier">
          <SelectBox
            id="z-courier"
            value={z.courier}
            onChange={(e) => setZ({ ...z, courier: e.target.value })}
          >
            <option value="">Not set</option>
            {[...new Set([...COURIERS, z.courier].filter(Boolean))].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </SelectBox>
        </Field>
      </div>
    </Dialog>
  );
}

export function ShippingForm({ initial }: { initial: ShippingInput }) {
  const [zones, setZones] = useState(initial.zones);
  const [express, setExpress] = useState<Express>(initial.express);
  const [saved, setSaved] = useState(initial);
  const [editing, setEditing] = useState<{ index: number; zone: Zone } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const current = { zones, express };
  const dirty = JSON.stringify(current) !== JSON.stringify(saved);

  const blank = (): Zone => ({
    id: `new-${Date.now()}`,
    name: "",
    cities: [],
    provinces: [],
    isFallback: false,
    rate: 250,
    freeOver: 5000,
    daysMin: 2,
    daysMax: 4,
    courier: "",
  });
  const ordered = [...zones.map((z, i) => ({ z, i }))].sort(
    (a, b) => Number(a.z.isFallback) - Number(b.z.isFallback),
  );

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Settings" }, { label: "Shipping" }]}
        title="Shipping"
        subtitle="Delivery rates customers see at checkout"
        actions={
          <>
            <button
              type="button"
              disabled={!dirty || pending}
              onClick={() => {
                setZones(saved.zones);
                setExpress(saved.express);
              }}
              className={cn(buttonStyles.secondary, "disabled:opacity-50")}
            >
              Discard
            </button>
            <button
              type="button"
              disabled={!dirty || pending}
              onClick={() =>
                start(async () => {
                  const ordered2 = [...zones].sort(
                    (a, b) => Number(a.isFallback) - Number(b.isFallback),
                  );
                  const r = await saveShipping({ zones: ordered2, express });
                  if (!r.ok) return toast.error(r.error);
                  toast.show(r.message);
                  router.refresh();
                  setSaved({ zones: ordered2, express });
                  setZones(ordered2);
                })
              }
              className={cn(buttonStyles.primary, "disabled:opacity-60")}
            >
              <Icon name="check" size={16} />
              {pending ? "Saving…" : "Save changes"}
            </button>
          </>
        }
      />
      <PageBody>
        <SettingsFrame active="shipping">
          <section className="border-admin-line overflow-hidden rounded-[12px] border bg-white shadow-[0_1px_0_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between gap-3 px-5 py-4">
              <h2 className="m-0 text-[16px] font-bold">Shipping rates by city</h2>
              <button
                type="button"
                onClick={() => setEditing({ index: -1, zone: blank() })}
                className="border-admin-field inline-flex h-9 cursor-pointer items-center gap-[6px] rounded-[8px] border bg-white px-3 text-[14px] font-semibold hover:bg-[#fafaf9]"
              >
                <Icon name="plus" size={16} />
                Add rate
              </button>
            </div>
            <div className="border-admin-line overflow-x-auto border-t">
              <div className="min-w-[760px]" role="table" aria-label="Shipping rates">
                <div
                  role="row"
                  className={cn(tableStyles.head, tableStyles.headShade)}
                  style={GRID}
                >
                  <span role="columnheader">City or zone</span>
                  <span role="columnheader" className="text-right">
                    Rate
                  </span>
                  <span role="columnheader" className="text-right">
                    Free over
                  </span>
                  <span role="columnheader">Delivery time</span>
                  <span role="columnheader">Courier</span>
                  <span role="columnheader" aria-label="Actions" />
                </div>
                {ordered.map(({ z, i }) => (
                  <div
                    key={z.id}
                    role="row"
                    className={cn(tableStyles.row, tableStyles.rowShade, "min-h-[62px]")}
                    style={GRID}
                  >
                    <span role="cell" className="flex min-w-0 flex-col">
                      <button
                        type="button"
                        onClick={() => setEditing({ index: i, zone: z })}
                        className="cursor-pointer truncate border-0 bg-transparent p-0 text-left text-[14px] font-semibold text-forest-600 hover:underline"
                      >
                        {z.name}
                      </button>
                      <span className="text-admin-muted truncate text-[13px]">
                        {z.isFallback
                          ? "Everywhere else"
                          : [...z.cities, ...z.provinces].join(", ")}
                      </span>
                    </span>
                    <span role="cell" className="text-right">
                      {rs(z.rate)}
                    </span>
                    <span role="cell" className="text-right">
                      {z.freeOver === null ? "Never" : rs(z.freeOver)}
                    </span>
                    <span role="cell" className="text-admin-muted">
                      {days(z.daysMin, z.daysMax)}
                    </span>
                    <span role="cell" className="truncate">
                      {z.courier || "—"}
                    </span>
                    <span role="cell" className="flex justify-center">
                      <button
                        type="button"
                        aria-label={`Edit ${z.name}`}
                        onClick={() => setEditing({ index: i, zone: z })}
                        className="border-admin-field grid h-8 w-[38px] cursor-pointer place-items-center rounded-[8px] border bg-white hover:bg-[#fafaf9]"
                      >
                        <Icon name="edit" size={15} />
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
          <Card>
            <CardHeader title="Express delivery" />
            <div className="flex items-center justify-between gap-4 border-b border-[#efefed] pb-[14px]">
              <span className="flex flex-col gap-[2px]">
                <span className="text-[14px] font-semibold">Offer express delivery</span>
                <span className="text-admin-muted text-[14px]">
                  {rs(express.rate)}, {days(express.daysMin, express.daysMax)} in major cities
                </span>
              </span>
              <Switch
                checked={express.enabled}
                onChange={(on) => setExpress({ ...express, enabled: on })}
                label="Offer express delivery"
              />
            </div>
            {express.enabled ? (
              <div className="grid grid-cols-3 gap-3 pt-[14px]">
                {(
                  [
                    ["rate", "Rate (Rs)"],
                    ["daysMin", "Fastest (days)"],
                    ["daysMax", "Slowest (days)"],
                  ] as const
                ).map(([k, l]) => (
                  <Field key={k} label={l} htmlFor={`ex-${k}`}>
                    <input
                      id={`ex-${k}`}
                      inputMode="numeric"
                      value={express[k]}
                      onChange={(e) =>
                        setExpress({
                          ...express,
                          [k]: Math.max(
                            0,
                            Math.round(Number(e.target.value.replace(/[,\s]/g, "")) || 0),
                          ),
                        })
                      }
                      className={fieldStyles.input}
                    />
                  </Field>
                ))}
              </div>
            ) : null}
          </Card>
          <p className="text-admin-muted m-0 text-[14px]">
            At checkout the customer&apos;s city picks the rate (a city rate first, then their
            province, then the rest of Pakistan). Before they choose a city the cart shows the
            lowest rate.
          </p>
        </SettingsFrame>
      </PageBody>
      {editing ? (
        <ZoneDialog
          zone={editing.zone}
          onClose={() => setEditing(null)}
          onSave={(z) => {
            setZones((list) =>
              editing.index < 0 ? [...list, z] : list.map((x, j) => (j === editing.index ? z : x)),
            );
            setEditing(null);
          }}
          onDelete={
            editing.index >= 0
              ? () => {
                  setConfirmDelete(editing.index);
                  setEditing(null);
                }
              : undefined
          }
        />
      ) : null}
      <Dialog
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title="Delete this rate?"
        footer={
          <>
            <button
              type="button"
              onClick={() => setConfirmDelete(null)}
              className={buttonStyles.secondary}
            >
              Keep it
            </button>
            <DangerButton
              onClick={() => {
                setZones((list) => list.filter((_, j) => j !== confirmDelete));
                setConfirmDelete(null);
              }}
            >
              Delete rate
            </DangerButton>
          </>
        }
      >
        <p className="text-admin-muted m-0">
          Customers in {confirmDelete !== null ? zones[confirmDelete]?.name : ""} will get the next
          matching rate. Nothing changes until you save.
        </p>
      </Dialog>
    </>
  );
}
