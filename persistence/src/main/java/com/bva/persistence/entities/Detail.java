package com.bva.persistence.entities;

import com.bva.vinocarto_core.model.DetailDto;
import com.bva.vinocarto_core.model.DetailType;
import jakarta.persistence.*;

@Entity
@Table(name = "DETAIL")
public class Detail {

    @Id
    @GeneratedValue(strategy= GenerationType.AUTO)
    @Column(name = "ID")
    private Long id;
    @ManyToOne
    @JoinColumn(name = "REGION_ID_FK")
    private Region region;
    @ManyToOne
    @JoinColumn(name = "COUNTRY_ID_FK")
    private Country country;
    @ManyToOne
    @JoinColumn(name = "APPELLATION_ID_FK")
    private Appellation appellation;
    @Column(name = "TYPE")
    @Enumerated(EnumType.ORDINAL)
    private DetailType type;
    @Column(name="MAP_READY")
    private boolean mapReady;
    @Column(name="DESCRIPTION")
    private String description;

    public Detail(Long id, Region region, Country country, Appellation appellation, DetailType type, boolean mapReady, String description) {
        this.id = id;
        this.region = region;
        this.country = country;
        this.appellation = appellation;
        this.type = type;
        this.mapReady = mapReady;
        this.description = description;
    }

    public Detail() {

    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Region getRegion() {
        return region;
    }

    public void setRegion(Region region) {
        this.region = region;
    }

    public Country getCountry() {
        return country;
    }

    public void setCountry(Country country) {
        this.country = country;
    }

    public Appellation getAppellation() {
        return appellation;
    }

    public void setAppellation(Appellation appellation) {
        this.appellation = appellation;
    }

    public DetailType getType() {
        return type;
    }

    public void setType(DetailType type) {
        this.type = type;
    }

    public boolean isMapReady() {
        return mapReady;
    }

    public void setMapReady(boolean mapReady) {
        this.mapReady = mapReady;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    @Override
    public String toString() {
        final StringBuilder sb = new StringBuilder("Appellation{");
        sb.append("id=").append(id);
        sb.append(", region=").append(region);
        sb.append(", country=").append(country);
        sb.append(", appellation=").append(appellation);
        sb.append(", type=").append(type);
        sb.append(", mapReady=").append(mapReady);
        sb.append(", description='").append(description).append('\'');
        sb.append('}');
        return sb.toString();
    }

    public DetailDto toDto() {
        return new DetailDto(
              this.getId(),
              this.getRegion() != null ? this.region.getName() : "",
              this.getCountry() != null ? this.getCountry().getName() : "",
              this.type.name(),
              this.getAppellation() != null ? this.getAppellation().getName() : "",
              this.mapReady,
              this.getDescription()
        );
    }

    public static Detail fromDto(DetailDto dto) {
        Region region = new Region();
        Country country = new Country();
        Appellation appellation = new Appellation();
        region.setName(dto.getRegion());
        country.setName(dto.getCountry());
        appellation.setName(dto.getAppellation());
        return new Detail(dto.getId(), region, country, appellation, DetailType.valueOf(dto.getType().toUpperCase()), dto.isMapReady(), dto.getDescription());
    }
}
