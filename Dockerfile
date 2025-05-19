FROM maven:3.9.6-eclipse-temurin-21 AS builder
LABEL authors="bertrand"
WORKDIR /app
COPY . .
RUN ./mvnw clean package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=builder /app/backend-services/target/*.jar app.jar
EXPOSE 8080
CMD ["java", "-jar", "app.jar"]