# Imagem Airflow com Ro-DOU instalado a partir do repositório oficial
# https://github.com/gestaogovbr/Ro-dou

FROM python:3.10-slim AS rodou-source
RUN apt-get update && apt-get install -y git --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*
RUN git clone --depth=1 https://github.com/gestaogovbr/Ro-dou /rodou

FROM apache/airflow:2.10.0-python3.10

USER root
COPY --from=rodou-source /rodou/requirements.txt /tmp/rodou-requirements.txt
COPY --from=rodou-source /rodou/src /opt/airflow/dags/ro_dou_src

USER airflow
RUN pip install --no-cache-dir -r /tmp/rodou-requirements.txt
