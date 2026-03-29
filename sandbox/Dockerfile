FROM eclipse-temurin:25-jdk-jammy

# Kurulum için gerekli paketler
RUN apt-get update && apt-get install -y curl wget tar locales && rm -rf /var/lib/apt/lists/*

# Yerel (locale) ayarlarının yapılandırılması (Meşhur Turkish I problemini kalıcı engeller)
RUN locale-gen en_US.UTF-8
ENV LANG=en_US.UTF-8
ENV LANGUAGE=en_US:en
ENV LC_ALL=en_US.UTF-8

# Daml SDK kurulumu (3.4.11)
RUN curl -sSL https://get.daml.com/ | sh -s 3.4.11

# ~/.daml/bin dizinini PATH'e ekleme
ENV PATH="/root/.daml/bin:${PATH}"

WORKDIR /workspace

# Container başladığında çalışacak komut
CMD ["daml", "sandbox", "--json-api-port", "7575"]
