-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateTable
CREATE TABLE "Race" (
    "id" SERIAL NOT NULL,
    "external_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "city" TEXT NOT NULL,
    "location" geography(Point, 4326) NOT NULL,
    "types" TEXT[],
    "min_km" DECIMAL(10,2) NOT NULL,
    "max_km" DECIMAL(10,2) NOT NULL,
    "min_dplus" INTEGER,
    "max_dplus" INTEGER,
    "raw_distances" JSONB NOT NULL,
    "url" TEXT,
    "source" TEXT,

    CONSTRAINT "Race_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Race_external_id_key" ON "Race"("external_id");

-- CreateIndex
CREATE INDEX "location_idx" ON "Race" USING GIST ("location");
